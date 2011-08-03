/*
 * Copyright 2004-2011 ICEsoft Technologies Canada Corp. (c)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions an
 * limitations under the License.
 */

package org.icefaces.generator.xmlbuilder;

import org.icefaces.generator.utils.FileWriter;
import org.w3c.dom.Document;
import org.w3c.dom.Element;
import org.w3c.dom.Text;

import javax.xml.parsers.DocumentBuilderFactory;
import javax.xml.parsers.ParserConfigurationException;
import javax.xml.transform.OutputKeys;
import java.util.Properties;


public abstract class XMLBuilder {
    private Document document;
    private DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
    private String fileName;
    Properties properties = new Properties();

    public XMLBuilder(String fileName) {
        this.fileName = fileName;
        properties.put(OutputKeys.INDENT, "yes");
        try {
            document = factory.newDocumentBuilder().newDocument();
        } catch (ParserConfigurationException e) {
            e.printStackTrace();
        }
    }

    public Document getDocument() {
        return document;
    }

    public void setDocument(Document document) {
        this.document = document;
    }

    public String getFileName() {
        return fileName;
    }

    public void setFileName(String fileName) {
        this.fileName = fileName;
    }

    public void write() {
        FileWriter.writeXML(getDocument(), getFileName(), getProperties());
    }

    public Properties getProperties() {
        return properties;
    }

    public void setProperties(Properties properties) {
        this.properties = properties;
    }

    public Element addNode(Element parent, String name, String value) {
        Element node = getDocument().createElement(name);
        Text node_text = getDocument().createTextNode(value);
        node.appendChild(node_text);
        parent.appendChild(node);
        return node;
    }
}
